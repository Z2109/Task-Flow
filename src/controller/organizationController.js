
import User from "../models/userModel.js";
import Organization from "../models/organizationModel.js";
import OrganizationMember from "../models/organizationMemberModel.js";
import Permission from "../models/permissionModel.js";
import Role from "../models/roleModel.js";
import RoleAssignment from "../models/roleAssignmentModel.js";


const createOrganization = async (req,res,next) =>{
    try {
        // Get logged in users ID from auth middleware
        const userId = req.userId;
        const {name} = req.body;

        // Validate input
        if(!userId){
            return res.status(401).json({
                success: false,
                message:"Authentication required",
            });
        }

        //check whether the user exists
        const user = await User.findById(userId);

        if(!user || user.isActive === false){
            return res.status(401).json({
                success:false,
                message:"User not found or inactive",
            });
        }

        //create a url-friendly organization slug 
        const slug = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

        if(!slug){
            return res.status(400).json({
                success:false,
                message:"Please provide a valid organization name",
            });
        }

        //get seeded permissions

        const permission = await Permission.find({}).select("_id");

        if(permission.length === 0){
            return res.status(500).json({
                success:false,
                message:"No permission found. Seed permission first.",
            });
        }

        // create organization
        const organization = await Organization.create({
            name: name.trim(),
            slug,
            owner: userId,
        });

        // add creator as an active member

        await OrganizationMember.create({
            organization:organization._id,
            user:userId,
            status: "active",
            joinedAt:new Date(),
        });

        
        // Create the Owner role
        const ownerRole = await Role.create({
            name: "Owner",
            slug: "owner",
            description: "Full access to this organization",

            // Link the role to the organization
            organization: organization._id,

            // Assign all seeded permissions
            permissions: permission.map((item) => item._id),

            scope: "organization",
            isSystem: true,
        });

        // Assign Owner role to the creator
        await RoleAssignment.create({
            user: userId,
            role: ownerRole._id,
            organization: organization._id,
            project: null,
            grantedBy: userId,
        });


        // send success response
        return res.status(201).json({
            success:true,
            message:"Organization created successfully",
            data:{
                organization,
                role:ownerRole,
            },
        });
        
    } catch (error) {
        // Duplicate organization slug
        if (error.code === 11000) {
        return res.status(409).json({
        success: false,
        message: "An organization with this slug already exists",
        });
    }
    next(error);
    }
}; 

export {createOrganization}