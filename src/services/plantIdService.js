/**
 * Pl@ntNet only accepts jpeg and png uploads, and infers the type from the
 * uploaded filename. Returns the blob to send plus the matching extension,
 * re-encoding to jpeg when the source is some other format (webp, gif, ...)
 * or when the type is unknown.
 */
async function toSupportedImage(blob) {
    if (blob.type === 'image/jpeg') return { blob, extension: 'jpg' };
    if (blob.type === 'image/png') return { blob, extension: 'png' };

    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0);
    bitmap.close();

    const jpeg = await new Promise((resolve, reject) => {
        canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error('Could not convert image to JPEG.'))),
            'image/jpeg',
            0.92
        );
    });

    return { blob: jpeg, extension: 'jpg' };
}

/**
 * Service for interacting with the Pl@ntNet API.
 */
export const PlantIdService = {
    /**
     * Identifies a plant from one or more images.
     * @param {string[]} imageBase64Array - Array of base64 image strings.
     * @param {string} apiKey - The Pl@ntNet API Key.
     * @returns {Promise<Object>} - The API identification results.
     */
    async identify(imageBase64Array, apiKey) {
        if (!apiKey) throw new Error("No API Key configured. Please go to Settings.");

        const formData = new FormData();
        
        console.log("PlantIdService: Starting identification with images count:", imageBase64Array.length);

        const count = Math.min(imageBase64Array.length, 5);

        for (let i = 0; i < count; i++) {
            const imgSrc = imageBase64Array[i];
            console.log(`PlantIdService: Preparing image ${i+1}. Is Data URI? ${imgSrc.startsWith('data:')}`);
            try {
                const blob = await fetch(imgSrc).then(r => r.blob());

                // Pl@ntNet decides the file type from the part's filename, so a
                // bare Blob (sent as filename="blob") is rejected with
                // "Unsupported file type for image[n] (jpeg or png)". It only
                // accepts jpeg and png, so anything else is converted first.
                const { blob: uploadBlob, extension } = await toSupportedImage(blob);
                formData.append('images', uploadBlob, `image${i}.${extension}`);
                formData.append('organs', 'auto');
            } catch (err) {
                console.error(`PlantIdService: CORS or fetch error on image source: ${imgSrc.substring(0, 50)}...`, err);
                throw new Error(`Failed to load image ${i+1} for identification. If it's a remote URL, there may be a CORS issue with the image host. Error: ${err.message}`);
            }
        }

        const apiUrl = `/api/plantnet/v2/identify/all?api-key=${apiKey}`;
        console.log("PlantIdService: Making request to proxy URL:", apiUrl);

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                body: formData
            });

            console.log("PlantIdService: Proxy response received with status:", response.status);

            if (!response.ok) {
                // The proxy can fail before reaching Pl@ntNet, in which case the
                // body is an HTML error page rather than JSON - read it as text
                // first so the real reason isn't swallowed into an empty object.
                const raw = await response.text().catch(() => '');
                let errorData = {};
                try {
                    errorData = raw ? JSON.parse(raw) : {};
                } catch {
                    errorData = { message: raw.slice(0, 300) };
                }
                console.error("PlantIdService: API returned error:", response.status, errorData);
                
                // If the Pl@ntNet API simply cannot find a matching plant, it returns 404
                if (response.status === 404 && (errorData.message === "Species not found" || errorData.error === "not found")) {
                    return { results: [] }; 
                }
                
                throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (err) {
            console.error("PlantIdService: Identification failed:", err);
            throw new Error(`Identification failed: ${err.message}`);
        }
    },

    /**
     * Extracts the best match common and scientific names from API results.
     */
    getBestMatch(data) {
        if (!data.results || data.results.length === 0) return null;
        
        const topResult = data.results[0];
        const scientificName = topResult.species.scientificNameWithoutAuthor || topResult.species.scientificName;
        const commonName = (topResult.species.commonNames && topResult.species.commonNames.length > 0) 
            ? topResult.species.commonNames[0] 
            : null;
        
        return {
            commonName,
            scientificName,
            score: topResult.score
        };
    }
};
