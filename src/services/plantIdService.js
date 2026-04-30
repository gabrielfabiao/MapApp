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

        for (let i = 0; i < Math.min(imageBase64Array.length, 5); i++) {
            const imgSrc = imageBase64Array[i];
            console.log(`PlantIdService: Preparing image ${i+1}. Is Data URI? ${imgSrc.startsWith('data:')}`);
            try {
                const blob = await fetch(imgSrc).then(r => r.blob());
                formData.append('images', blob);
            } catch (err) {
                console.error(`PlantIdService: CORS or fetch error on image source: ${imgSrc.substring(0, 50)}...`, err);
                throw new Error(`Failed to load image ${i+1} for identification. If it's a remote URL, there may be a CORS issue with the image host. Error: ${err.message}`);
            }
        }
        
        formData.append('organs', 'auto');

        const apiUrl = `/plantnet/v2/identify/all?api-key=${apiKey}`;
        console.log("PlantIdService: Making request to proxy URL:", apiUrl);

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                body: formData
            });

            console.log("PlantIdService: Proxy response received with status:", response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("PlantIdService: API returned error:", errorData);
                
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
