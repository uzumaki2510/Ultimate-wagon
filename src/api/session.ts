let accessToken: string | null = null;
let sessionGeneration = 0;
export const getAccessToken = () => accessToken;
export const getSessionGeneration = () => sessionGeneration;
export const setAccessToken = (token: string | null) => { accessToken = token; };
export const clearSession = () => {
  accessToken = null;
  sessionGeneration += 1;
  localStorage.removeItem('wagon_access_token');
  window.dispatchEvent(new Event('wagon:session-ended'));
};
