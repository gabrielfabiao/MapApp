export function fromDbRow(row) {
    return {
        id: row.id,
        name: row.name,
        image: row.image,
        markerType: row.marker_type,
        markers: row.markers || [],
        buildings: row.buildings || [],
        trees: [],
        pixelsPerUnit: row.pixels_per_unit,
        location: row.location,
        northBearing: row.north_bearing,
        updatedAt: new Date(row.updated_at).getTime(),
    };
}

export function toDbRow(project, userId) {
    return {
        id: project.id,
        user_id: userId,
        name: project.name,
        image: project.image,
        marker_type: project.markerType,
        markers: project.markers,
        buildings: project.buildings,
        pixels_per_unit: project.pixelsPerUnit,
        location: project.location,
        north_bearing: project.northBearing,
        updated_at: new Date(project.updatedAt).toISOString(),
    };
}
