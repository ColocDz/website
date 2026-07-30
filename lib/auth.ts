import { getSession } from './auth-server';

export const auth = {
  api: {
    getSession: async (opts?: any) => {
      return await getSession();
    }
  }
};
