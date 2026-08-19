// Mocking Firebase for local-only operation
export const auth: any = {
  currentUser: null
};

export const db: any = {};

export const googleProvider = {};

let authListeners: Array<(user: any) => void> = [];

const getUserFromUid = (uid: string | null) => {
  if (!uid) return null;
  let localUser: any = null;
  try {
    const raw = localStorage.getItem('ds_local_users');
    const users = raw ? JSON.parse(raw) : [];
    if (Array.isArray(users)) {
      localUser = users.find((u: any) => u && u.uid === uid);
    }
  } catch (e) {
    console.error("Error reading ds_local_users", e);
  }
  
  const demos = [
    { email: 'admin@steersafe.com', pass: 'admin123', role: 'Admin', uid: 'admin-1', displayName: 'Admin User' },
    { email: 'coach@steersafe.com', pass: 'coach123', role: 'Instructor', uid: 'inst-1', displayName: 'John Miller' },
    { email: 'student@steersafe.com', pass: 'learn123', role: 'Student', uid: 'std-1', displayName: 'Ryan Patel' },
    { email: 'parent@steersafe.com', pass: 'safe123', role: 'Parent', uid: 'par-1', displayName: 'Parent Patel' },
  ];
  const demo = demos.find(d => d.uid === uid);

  if (demo) {
    return { uid: demo.uid, email: demo.email, displayName: demo.displayName };
  }
  if (localUser) {
    const emailStr = localUser.email || 'user@example.com';
    return { 
      uid: localUser.uid || uid, 
      email: emailStr, 
      displayName: localUser.displayName || (emailStr.includes('@') ? emailStr.split('@')[0] : emailStr) 
    };
  }
  return { uid, email: 'user@example.com', displayName: 'Demo User' };
};

const notifyAuthListeners = () => {
  const uid = localStorage.getItem('ds_current_user_uid');
  const user = getUserFromUid(uid);
  auth.currentUser = user;
  authListeners.forEach(cb => {
    try {
      cb(user);
    } catch (e) {
      console.error(e);
    }
  });
};

export const signInWithPopup = async (...args: any[]) => {
  localStorage.setItem('ds_current_user_uid', 'admin-1');
  const user = getUserFromUid('admin-1');
  notifyAuthListeners();
  return { user };
};

export const signOut = async (...args: any[]) => {
  localStorage.removeItem('ds_current_user_uid');
  notifyAuthListeners();
};

export const onAuthStateChanged = (authObj: any, callback: (user: any) => void) => {
  authListeners.push(callback);
  const uid = localStorage.getItem('ds_current_user_uid');
  const user = getUserFromUid(uid);
  auth.currentUser = user;
  callback(user);
  return () => {
    authListeners = authListeners.filter(cb => cb !== callback);
  };
};

export const signInWithEmailAndPassword = async (...args: any[]) => {
  const [authObj, email, pass] = args;
  let users: any[] = [];
  try {
    const raw = localStorage.getItem('ds_local_users');
    users = raw ? JSON.parse(raw) : [];
  } catch (e) {
    users = [];
  }
  
  const demos = [
    { email: 'admin@steersafe.com', pass: 'admin123', role: 'Admin', uid: 'admin-1' },
    { email: 'coach@steersafe.com', pass: 'coach123', role: 'Instructor', uid: 'inst-1' },
    { email: 'student@steersafe.com', pass: 'learn123', role: 'Student', uid: 'std-1' },
    { email: 'parent@steersafe.com', pass: 'safe123', role: 'Parent', uid: 'par-1' },
  ];
  
  const user = Array.isArray(users) ? users.find((u: any) => u && u.email === email && u.password === pass) : null;
  const demo = demos.find(d => d.email === email && d.pass === pass);

  if (user || demo) {
    const activeUser = user || demo;
    localStorage.setItem('ds_current_user_uid', activeUser.uid);
    
    if (demo) {
      let profiles: Record<string, any> = {};
      try {
        const rawProfiles = localStorage.getItem('ds_user_profiles');
        profiles = rawProfiles ? JSON.parse(rawProfiles) : {};
      } catch (e) {
        profiles = {};
      }
      if (!profiles[demo.uid]) {
        profiles[demo.uid] = {
          uid: demo.uid,
          email: demo.email,
          displayName: demo.role,
          role: demo.role,
          associatedId: demo.uid === 'inst-1' ? 'tr-1' : (demo.uid === 'std-1' || demo.uid === 'par-1' ? 'std-1' : undefined)
        };
        localStorage.setItem('ds_user_profiles', JSON.stringify(profiles));
      }
    }
    
    notifyAuthListeners();
    return { user: activeUser };
  }
  throw new Error("Invalid credentials");
};

export const createUserWithEmailAndPassword = async (...args: any[]) => {
  const [authObj, email, pass] = args;
  let users: any[] = [];
  try {
    const raw = localStorage.getItem('ds_local_users');
    users = raw ? JSON.parse(raw) : [];
  } catch (e) {
    users = [];
  }
  if (Array.isArray(users) && users.find((u: any) => u && u.email === email)) {
    throw new Error("User already exists");
  }
  const newUser = { uid: `u-${Date.now()}`, email, password: pass };
  if (Array.isArray(users)) {
    users.push(newUser);
  } else {
    users = [newUser];
  }
  localStorage.setItem('ds_local_users', JSON.stringify(users));
  localStorage.setItem('ds_current_user_uid', newUser.uid);
  notifyAuthListeners();
  return { user: newUser };
};

export const sendPasswordResetEmail = async (...args: any[]) => {
  console.log("Mock: Reset email sent to", args[1]);
};

export type FirebaseUser = any;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  console.error(`Local Persistence Error [${operationType}] on [${path}]:`, error);
  throw new Error(String(error));
}
