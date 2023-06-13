import Cookies from "universal-cookie";

export const confeeDecode = (string: any) => {
    let parsedString = string.replaceAll(" ", "").toLowerCase();
    if (!parsedString.includes("d1")) {
        return string;
    }
    let resultString = "";
    const delimeter = "d1";
    const result = parsedString.split(delimeter);

    result.map(
        (resultChar) => (resultString += String.fromCharCode(resultChar))
    );

    return resultString.replace("\x00", "");
};

export const confeeEncode = (string: any) => {
    const delimeter = "d1";
    if (!string) {
        return null;
    }

    let resultString = "";

    string.split("").map((char) => {
        resultString += `${char.charCodeAt()}${delimeter}`;
    });

    return resultString;
};

const cookies = new Cookies();

export const saveTokenToCookie = (token: string) => {
    cookies.set("confee_access_token", token, {
        path: "/",
        domain: window.location.hostname,
    });
};

export const _isAuthenticated = () => {
    return cookies.get("confee_access_token");
};

export const signOut = () => {
    cookies.remove("confee_access_token", {
        path: "/",
        domain: window.location.hostname,
    });
    window.location.reload();
};

export const updateUserData = (data: any) => {
    const currentSettingsJSON = window.localStorage.getItem('features/base/user');
    let currentSettings = JSON.parse(currentSettingsJSON);
    currentSettings = {...currentSettings, ...data}
    window.localStorage.setItem('features/base/user', JSON.stringify(currentSettings))
};

export const API_URL = "https://admin.confee.ru/api/v1";
