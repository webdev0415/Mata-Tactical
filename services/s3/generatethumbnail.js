import AWS from "aws-sdk";
import util from "util";
import sharp from "sharp";

// get reference to S3 client
const s3 = new AWS.S3();

export const main = async (event, context, callback) => {
  // Read options from the event parameter.
  if (process.env.USING_THUMBNAIL === "false") {
    return;
  }
  console.log(
    "Reading options from event:\n",
    util.inspect(event, { depth: 5 })
  );
  const srcBucket = event.Records[0].s3.bucket.name;
  // Object key may have spaces or unicode non-ASCII characters.
  const srcKey = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, " ")
  );

  let dstKeyTemp = await srcKey.replace("/profile", "/thumbnail-profile");
  let dstKeyTemp1 = await dstKeyTemp.replace("/products", "/thumbnail-products");
  let dstKey = await dstKeyTemp1.replace("/ffl-image", "/thumbnail-ffl-image");
  // Infer the image type from the file suffix.
  const typeMatch = srcKey.match(/\.([^.]*)$/);
  if (!typeMatch) {
    console.log("Could not determine the image type.");
    return;
  }

  // Check that the image type is supported
  const imageType = typeMatch[1].toLowerCase();
  if (
    imageType != "jpg" &&
    imageType != "png" &&
    imageType != "tiff" &&
    imageType != "gif" &&
    imageType != "jpeg" &&
    imageType != "webp" &&
    imageType != "tif" &&
    imageType != "svg"
  ) {
    console.log(`Unsupported image type: ${imageType}`);
    return;
  }

  // Download the image from the S3 source bucket.

  try {
    const params = {
      Bucket: srcBucket,
      Key: srcKey,
    };
    var origimage = await s3.getObject(params).promise();
  } catch (error) {
    console.log(error);
    return;
  }

  // set thumbnail width. Resize will set the height automatically to maintain aspect ratio.
  const width = 50;

  // Use the Sharp module to resize the image and save in a buffer.
  try {
    var buffer = await sharp(origimage.Body).resize(width).toBuffer();
  } catch (error) {
    console.log(error);
    return;
  }

  // Upload the thumbnail image to the destination bucket
  try {
    const destparams = {
      Bucket: srcBucket,
      Key: dstKey,
      Body: buffer,
      ContentType: "image",
    };

    await s3.putObject(destparams).promise();
  } catch (error) {
    console.log(error);
    return;
  }

  console.log(
    "Successfully resized " +
      srcBucket +
      "/" +
      srcKey +
      " and uploaded to " +
      srcBucket +
      "/" +
      dstKey
  );
};
