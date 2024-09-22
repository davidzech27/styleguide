function hexToRgb(hex: `#${string}`) {
    let bigint = parseInt(hex.slice(1), 16)
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255,
    }
}

function rgbToHex({ r, g, b }: { r: number; g: number; b: number }) {
    return ("#" +
        ((1 << 24) + (r << 16) + (g << 8) + b)
            .toString(16)
            .slice(1)
            .toUpperCase()) as `#${string}`
}

export function blendColors(
    colors: Array<`#${string}` | { color: `#${string}`; weight: number }>,
) {
    let rgbColors = colors.map((color) =>
        typeof color === "string"
            ? { ...hexToRgb(color), weight: 1 }
            : { ...hexToRgb(color.color), weight: color.weight },
    )

    let totalWeight = rgbColors.reduce((sum, color) => sum + color.weight, 0)

    let blended = {
        r: Math.round(
            rgbColors.reduce((sum, color) => sum + color.r * color.weight, 0) /
                totalWeight,
        ),
        g: Math.round(
            rgbColors.reduce((sum, color) => sum + color.g * color.weight, 0) /
                totalWeight,
        ),
        b: Math.round(
            rgbColors.reduce((sum, color) => sum + color.b * color.weight, 0) /
                totalWeight,
        ),
    }

    return rgbToHex(blended)
}
