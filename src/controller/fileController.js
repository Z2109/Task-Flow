
import { Readable } from "stream";
import cloudinary from "../config/cloudinary.js";
import File from "../models/fileModel.js";

// Upload file to Cloudinary
const uploadToCloudinary = (file, projectId) => {
  return new Promise((resolve, reject) => {
    try {
      // Validate file
      if (!file || !file.buffer) {
        return reject(new Error("No file buffer provided."));
      }

      if (!projectId) {
        return reject(new Error("Project ID is required."));
      }

      // Cloudinary upload configuration
      const uploadOptions = {
        folder: `taskflow/projects/${projectId}`,
        resource_type: "auto",
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      };

      // Create Cloudinary upload stream
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            return reject(error);
          }

          if (!result) {
            return reject(
              new Error("Cloudinary did not return an upload result.")
            );
          }

          resolve(result);
        }
      );

      // Stream the complete file buffer
      Readable.from([file.buffer]).pipe(uploadStream);

    } catch (error) {
      reject(error);
    }
  });
};

export const uploadProjectFile = async (req, res, next) => {
  let cloudinaryResult;

  try {
    const { projectId } = req.params;
    const userId = req.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a file.",
      });
    }

    cloudinaryResult = await uploadToCloudinary(
      req.file,
      projectId
    );

    const newFile = await File.create({
      name: req.file.originalname,
      originalName: req.file.originalname,
      url: cloudinaryResult.secure_url,
      publicId: cloudinaryResult.public_id,
      resourceType: cloudinaryResult.resource_type,
      format: cloudinaryResult.format,
      size: req.file.size,
      mimeType: req.file.mimetype,
      project: projectId,
      uploadedBy: userId,
    });

    return res.status(201).json({
      success: true,
      message: "File uploaded successfully.",
      file: newFile,
    });

  } catch (error) {
    if (cloudinaryResult?.public_id) {
      try {
        await cloudinary.uploader.destroy(
          cloudinaryResult.public_id,
          {
            resource_type: cloudinaryResult.resource_type,
          }
        );
      } catch (deleteError) {
        console.error("Cloudinary rollback failed:", deleteError);
      }
    }

    next(error);
  }
};

// Get all files belonging to a project
export const getProjectFiles = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const files = await File.find({
      project: projectId,
    })
      .populate("uploadedBy", "name email avatar")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Project files fetched successfully.",
      count: files.length,
      files,
    });

  } catch (error) {
    next(error);
  }
};

// Delete project file
export const deleteProjectFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;

    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found.",
      });
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(
      file.publicId,
      {
        resource_type: file.resourceType,
        invalidate: true,
      }
    );

    if (!["ok", "not found"].includes(result.result)) {
      return res.status(500).json({
        success: false,
        message: "Unable to delete file from Cloudinary.",
      });
    }

    // Delete metadata from MongoDB
    await File.findByIdAndDelete(fileId);

    return res.status(200).json({
      success: true,
      message: "File deleted successfully.",
    });

  } catch (error) {
    next(error);
  }
};