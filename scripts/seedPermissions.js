import dotenv from "dotenv";
import mongoose from "mongoose";

import Permission from "../src/models/permissionModel.js";
import permissionRegistry from "../src/utils/permissionRegistry.js";
import connectDB from "../src/config/db.js";

dotenv.config();

const seedPermissions = async () => {
    try {
        await connectDB();

        for (const permission of permissionRegistry) {
            const exists = await Permission.findOne({
                key: permission.key,
            });

            if (!exists) {
                await Permission.create(permission);
                console.log(`${permission.key} added`);
            } else {
                console.log(`${permission.key} already exists`);
            }
        }

        console.log("Permission seeded successfully!");
    } catch (error) {
        console.error("Error:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

seedPermissions();
