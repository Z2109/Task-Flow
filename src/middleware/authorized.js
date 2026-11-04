
import Project from "../models/projectModel.js";

const authorizeProject = async (req, res, next) => {
  try {
    // Support both project routes and file routes
    const projectId = req.params.id || req.params.projectId;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required.",
      });
    }

    const project = await Project.findOne({
      _id: projectId,
      organization: req.organizationId,
      $or: [
        { owner: req.userId },
        { members: req.userId },
      ],
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or access denied.",
      });
    }

    req.project = project;
    req.projectId = project._id;

    next();
  } catch (error) {
    next(error);
  }
};

export default authorizeProject;
