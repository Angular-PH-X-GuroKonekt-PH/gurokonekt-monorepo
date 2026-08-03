export interface EnvironmentModel {
    CONTENTFUL_SPACE: string;
    CONTENTFUL_ACCESS_TOKEN: string;
    CONTENTFUL_EVENTS: string;
    SIGN_IN_URL: string;
    REGISTER_URL: string;
    /** Base URL of the Gurokonekt REST API, including the `/api` prefix. */
    API_URL: string;
    /**
     * Google reCAPTCHA v3 site key. Public by design — it is embedded in the
     * page HTML and is not a secret. Empty means reCAPTCHA is not configured.
     */
    RECAPTCHA_SITE_KEY: string;
}
