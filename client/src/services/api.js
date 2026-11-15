import axios from 'axios';
const api=axios.create({baseURL:import.meta.env.VITE_API_BASE_URL||'',timeout:20000});
export const get=async(path,params={})=>(await api.get(path,{params})).data;
export const post=async(path,data)=>(await api.post(path,data)).data;
export default api;
