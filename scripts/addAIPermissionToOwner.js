
import dotenv from "dotenv";
import mongoose from "mongoose";

import connectDB from "../src/config/db.js";
import Role from "../src/models/roleModel.js";
import Permission from "../src/models/permissionModel.js";

dotenv.config();

const addAIPermissionToOwner = async () => {
    try {
        await connectDB();

        const aiPermission = await Permission.findOne({
            key: "ai:chat",
        });

        if (!aiPermission) {
            throw new Error("ai:chat permission not found");
        }

        const ownerRoles = await Role.find({
            slug: "owner",
        });

        if (!ownerRoles.length) {
            console.log("No Owner role found.");
            return;
        }

        for (const role of ownerRoles) {
            const alreadyAssigned = role.permissions.some(
                (permissionId) =>
                    permissionId.toString() === aiPermission._id.toString()
            );

            if (!alreadyAssigned) {
                role.permissions.push(aiPermission._id);
                await role.save();

                console.log(
                    `AI permission added to Owner role: ${role._id}`
                );
            } else {
                console.log(
                    `AI permission already assigned: ${role._id}`
                );
            }
        }

        console.log("Owner AI permission update completed.");

    } catch (error) {
        console.error("Error:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

addAIPermissionToOwner();
