const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

function processImage() {
  const inputPath = path.join(__dirname, '../images/ColocDz_Logo.png');
  const outputPath = path.join(__dirname, '../public/ColocDz_Logo.png');

  fs.createReadStream(inputPath)
    .pipe(new PNG())
    .on('parsed', function () {
      let transparentCount = 0;
      let whiteCount = 0;

      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const idx = (this.width * y + x) << 2;
          const r = this.data[idx];
          const g = this.data[idx + 1];
          const b = this.data[idx + 2];
          const a = this.data[idx + 3];

          // If the pixel is white or very close to white, make it transparent
          if (r > 245 && g > 245 && b > 245) {
            this.data[idx + 3] = 0; // Set alpha to 0
            whiteCount++;
          } else if (a === 0) {
            transparentCount++;
          }
        }
      }

      console.log(`Processed: ${whiteCount} white pixels made transparent. Existing transparent: ${transparentCount}`);

      this.pack()
        .pipe(fs.createWriteStream(outputPath))
        .on('finish', () => {
          console.log('Successfully saved transparent logo to public/ColocDz_Logo.png');
          
          // Copy to app/icon.png and public/favicon.ico
          fs.copyFileSync(outputPath, path.join(__dirname, '../app/icon.png'));
          fs.copyFileSync(outputPath, path.join(__dirname, '../public/favicon.ico'));
          console.log('Copied processed logo to app/icon.png and public/favicon.ico');
        });
    })
    .on('error', (err) => {
      console.error('Error reading PNG file:', err);
    });
}

processImage();
