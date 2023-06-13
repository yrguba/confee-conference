import axios from "axios";
import Cookies from "universal-cookie";
// @ts-ignore
import { updateUserData } from "../../../utils";

const cookies = new Cookies();
const API_URL = "https://admin.confee.ru/api/v1";

interface ILoginData {
    email: string;
    password: string;
}

interface IConferenceCreateData {
    display_name: string;
}

export const auth = async (data: ILoginData) => {
    return axios
        .post(`${API_URL}/authorization/login`, data)
        .then((response) => {
            return response?.data?.data?.access_token;
        });
};

export const getCurrent = async () => {
    const token = cookies.get("confee_access_token");
    return axios
        .get(`${API_URL}/users/user/current`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        .then((response) => {
            const user = response?.data?.data;
            updateUserData({
                displayName: user.display_name,
                avatarURL: user.avatar,
            });
            return response?.data?.data;
        });
};

export const createConference = async (data: IConferenceCreateData) => {
    const token = cookies.get("confee_access_token");
    return axios
        .post(`${API_URL}/conference`, data, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        .then((response) => {
            return response?.data?.data;
        });
};

export const getConferenceList = async () => {
    const token = cookies.get("confee_access_token");
    return axios
        .get(`${API_URL}/conference/by_user`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        .then((response) => {
            return response?.data?.data;
        });
};

export const deleteConference = async (id: number) => {
    const token = cookies.get("confee_access_token");
    return axios
        .delete(`${API_URL}/conference/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        .then((response) => {
            return response?.data?.data;
        });
};
