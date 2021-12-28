import Axios from 'axios'


const instance = Axios.create({
    baseURL: 'https://acme.symliq.com',
    responseType: 'json',
    // timeout: 20000
})

const axios = instance;


export {
    axios
}