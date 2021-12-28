import { axios } from '../axios'



export const addBulkProductService = async (payload) => {
    try {
        const { data } = await axios.post('/workflow/product/bulk/upload', payload)
        return await Promise.resolve(data)
    } catch (err) {
        return await Promise.reject(err)
    }
}


export const addSingleProductService = async (payload) => {
    try {
        const { data } = await axios.post('/workflow/product', payload)
        return await Promise.resolve(data)
    } catch (err) {
        return await Promise.reject(err)
    }
}

export const getAllProductsService = async (page=null) => {
    let endString = ''
    if (page) endString = `?page=${page}`
    try {
        const { data } = await axios.get(`/workflow/product${endString}`)
        return await Promise.resolve(data)
    } catch (err) {
        return await Promise.reject(err)
    }
}

export const deleteAllProductsService = async () => {
    try {
        const { data } = await axios.delete(`/workflow/product`)
        return await Promise.resolve(data)
    } catch (err) {
        return await Promise.reject(err)
    }
}

export const searchProductsService = async (keyword) => {
    try {
        const { data } = await axios.get(`workflow/product/value/filter?search=${keyword}`)
        return await Promise.resolve(data)
    } catch (err) {
        return await Promise.reject(err)
    }
}



export const updateProductService = async (uuid, payload) => {
    try {
        const { data } = await axios.patch(`/workflow/product/${uuid}`, payload)
        return await Promise.resolve(data)
    } catch (err) {
        return await Promise.reject(err)
    }
}



export const deleteProductService = async (uuid) => {
    try {
        const { data } = await axios.delete(`/workflow/product/${uuid}`)
        return await Promise.resolve(data)
    } catch (err) {
        return await Promise.reject(err)
    }
}



