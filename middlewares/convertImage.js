const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

async function convertImageFile(inputPath) {
    if (!inputPath) return null

    const inputExt = path.extname(inputPath).toLowerCase()
    const inputStats = fs.statSync(inputPath)
    const inputSizeKB = inputStats.size / 1024

    const dir = path.dirname(inputPath)
    const baseName = path.basename(inputPath, inputExt)
    
    fs.mkdirSync(dir, { recursive: true })

    if (inputExt === '.webp' && inputSizeKB < 500) {
        const newStats = fs.statSync(inputPath)
        return { outputPath: inputPath, size: newStats.size }
    }

    let outputPath
    if (inputExt === '.webp') {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
        outputPath = path.join(dir, baseName + '-' + unique + '.webp')
    } else {
        outputPath = path.join(dir, baseName + '.webp')
    }

    if (inputSizeKB < 500) {
        await sharp(inputPath)
            .rotate()
            .webp({ quality: 80 })
            .toFile(outputPath)
    } else {
        let quality = 75
        let success = false
        while (quality >= 5) {
            await sharp(inputPath)
                .rotate()
                .webp({ quality })
                .toFile(outputPath)

            const outputStats = fs.statSync(outputPath)
            const outputSizeKB = outputStats.size / 1024
            if (outputSizeKB <= 500) {
                success = true
                break
            }
            quality -= 10
        }
    }

    try { fs.unlinkSync(inputPath) } catch (_) {}

    const newStats = fs.statSync(outputPath)
    return { outputPath, size: newStats.size }
}

module.exports = { convertImageFile }


