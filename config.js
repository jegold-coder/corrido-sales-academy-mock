"use strict";
// Switches for the optional sign-in. Nothing in this file is secret: a Google client ID is meant to be public.
const CSA_CONFIG = {
  // "Sign in with Google" turns on when this holds a Google client ID (free; steps are in the README under "Turn on Sign in with Google").
  // It looks like 1234567890-abc123.apps.googleusercontent.com. Leave it empty and the sign-in screen shows Google as "not set up yet".
  googleClientId: "",
  // Optional. Only let one company's Google accounts in, for example "tequilacorrido.com". Empty lets any Google account in.
  googleDomain: "",
};
