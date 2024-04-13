const ensureBmsFile = (value: any, c: any) => {
    const allowedExtensions = [".bms", ".bme", ".bml", ".pms"];
    let isBmsExt = false;
    try {
        if (typeof value["file"] !== 'object' || !(value["file"] instanceof File))
            return c.json({"status": "Uploaded file is not a BMS"}, 400);
        for (const e of allowedExtensions) {
            isBmsExt = value["file"]["name"].toLowerCase().endsWith(e);
            if (isBmsExt)
                break;
        }
    } catch {
        return c.json({"status": "Invalid request"}, 400);
    }
    if (!isBmsExt)
        return c.json({"status": "Uploaded file is not a BMS"}, 400);
    return value;
};

export { ensureBmsFile };