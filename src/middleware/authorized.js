
import Project from "../models/projectModel.js";

// Authorize project owner or team member

const authorizeProject = async (req, res, next) => {
    try {
        const { id } = req.params;

        const project = await Project.findOne({
            _id: id,
            organization: req.organizationId,
            $or: [
                { owner: req.userId },
                { members: req.userId },
            ],
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found or access denied",
            });
        }

        // Store project for later middleware/controllers
        req.project = project;
        req.projectId = project._id;

        next();

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export default authorizeProject;
