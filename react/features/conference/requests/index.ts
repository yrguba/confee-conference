import axios from "axios";
import Cookies from "universal-cookie";
// @ts-ignore
import { updateUserData } from "../../../utils";

const cookies = new Cookies();
const API_URL = "https://admin.confee.ru/api/v1";
const BASE_URL = "https://admin.confee.ru";

interface ILoginData {
    email: string;
    password: string;
}


export const auth = async (data: ILoginData) => {
    return axios
        .post(`${API_URL}/authorization/login`, data)
        .then((response) => {
            return response?.data?.data?.access_token;
        });
};

export const getConferenceByName = async (name: string) => {
    return axios
        .get(`${API_URL}/conference/by_name/${name}`)
        .then((response) => {
            return response?.data?.data;
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
                avatarURL: `${BASE_URL}${user.avatar}`,
            });
            return response?.data?.data;
        }).catch((error) => {
            throw error.response.data;
        });
};

export const checkCode = async (conferenceData: any) => {
    return axios
        .post(`${API_URL}/conference/check_code`, {
            name: conferenceData.name,
            code: conferenceData.code,
        })
        .then((response) => {
            return response?.data?.data;
        });
};
