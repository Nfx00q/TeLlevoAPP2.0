export {};

declare module 'google.maps' {
  export const maps: any;
}

declare global {
    interface Window {
      googleMapsCallback: () => void;
    }
}