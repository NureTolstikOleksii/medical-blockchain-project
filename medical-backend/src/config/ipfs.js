import { PinataSDK } from "pinata-web3";
import { Blob } from "buffer";

const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT,
    pinataGateway: process.env.PINATA_GATEWAY,
});

/**
 * Повна сумісність зі старим "ipfs.add"
 * @param {Buffer} buffer — вміст файлу
 * @param {string} fileName — оригінальна назва (test.png, xray.dcm, doc.docx...)
 * @param {string} mimeType — mimetype (image/png, application/pdf)
 * @returns {Promise<{ path: string }>}
 */

async function add(buffer, fileName = "file.bin", mimeType = "application/octet-stream") {
    // створюємо Blob з буфера
    const blob = new Blob([buffer], { type: mimeType });

    // File є глобально в Node 20+
    const file = new File([blob], fileName, { type: mimeType });

    // завантаження у Pinata
    const result = await pinata.upload.file(file);

    // Повертаємо ⇦ так, як DoctorService очікує
    return {
        path: result.IpfsHash || result.cid || result.hash || null
    };
}

/**
 * Альтернативний метод (якщо тобі окремо потрібен)
 */

async function uploadFile(buffer, fileName, mimeType) {
    return (await add(buffer, fileName, mimeType)).path;
}

export default {
    add,
    uploadFile
};
