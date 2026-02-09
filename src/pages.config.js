/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AnnexaCookies from './pages/AnnexaCookies';
import AnnexaPrivacy from './pages/AnnexaPrivacy';
import AnnexaTerms from './pages/AnnexaTerms';
import DataRequest from './pages/DataRequest';
import Preview from './pages/Preview';
import Form from './pages/Form';
import Home from './pages/Home';
import URLCapture from './pages/URLCapture';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AnnexaCookies": AnnexaCookies,
    "AnnexaPrivacy": AnnexaPrivacy,
    "AnnexaTerms": AnnexaTerms,
    "DataRequest": DataRequest,
    "Preview": Preview,
    "Form": Form,
    "Home": Home,
    "URLCapture": URLCapture,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};