import Axios from 'axios'


const instance = Axios.create({
    baseURL: 'http://104.131.14.144',
    responseType: 'json',
    // timeout: 20000
})

const axios = instance;


export {
    axios
}