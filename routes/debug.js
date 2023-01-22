const express = require("express");
const config = require("../config.json");
const middlewares = require("../helpers/middlewares");
const User = require("../models/user");

const router = express.Router();

router.use(middlewares.isLoggedIn);
router.use(middlewares.isPishifat);

/* POST move user to NAT */
router.post("/moveToNat", async (req, res) => {
    const user = await User.findOne({ osuId: config.admin.pishifat });
    user.isTrialNat = false;
    const i = user.groups.findIndex((g) => g === "bn");
    if (i !== -1) user.groups.splice(i, 1, "nat");
    await user.save();

    res.json({
        user,
        success: "moved to NAT",
    });
});

/* POST move user to trial NAT */
router.post("/moveToTrialNat", async (req, res) => {
    const user = await User.findOne({ osuId: config.admin.pishifat });
    user.isTrialNat = true;
    const i = user.groups.findIndex((g) => g === "nat");
    if (i !== -1) user.groups.splice(i, 1, "bn");
    await user.save();

    res.json({
        user,
        success: "moved to BN Evaluator",
    });
});

/* POST move user to GMT */
router.post("/moveToGmt", async (req, res) => {
    const user = await User.findOne({ osuId: config.admin.pishifat });
    if (!user.groups.includes("gmt")) user.groups.push("gmt");
    await user.save();

    res.json({
        user,
        success: "moved to GMT",
    });
});

/* POST remove user from GMT */
router.post("/removeFromGmt", async (req, res) => {
    const user = await User.findOne({ osuId: config.admin.pishifat });
    if (user.groups.includes("gmt")) {
        const i = user.groups.findIndex((g) => g === "gmt");
        user.groups.splice(i, 1);
    }
    await user.save();

    res.json({
        user,
        success: "removed from GMT",
    });
});

/* POST move user to user */
router.post("/moveToUser", async (req, res) => {
    const user = await User.findOne({ osuId: config.admin.pishifat });
    user.groups = ["user"];
    user.modesInfo = [];
    user.modes = [];
    user.fullModes = [];
    user.probationModes = [];
    await user.save();

    res.json({
        user,
        success: "moved to user",
    });
});

/* POST move user to full BN */
router.post("/moveToBn/:mode", async (req, res) => {
    const user = await User.findOne({ osuId: config.admin.pishifat });
    const mode = req.params.mode;
    user.isTrialNat = false;
    if (!user.groups.includes("bn")) user.groups.push("bn");
    const i = user.groups.findIndex((g) => g === "nat");
    if (i !== -1) user.groups.splice(i, 1);
    if (!user.modes.includes(mode)) user.modes.push(mode);
    if (!user.fullModes.includes(mode)) user.modes.push(mode);
    if (user.probationModes.includes(mode)) {
        const i = user.probationModes.findIndex((g) => g === mode);
        user.probationModes.splice(i, 1);
    }
    const found = user.modesInfo.find((m) => m.mode === mode);
    if (!found) user.modesInfo.push({ mode: mode, level: "full" });
    else {
        user.modesInfo.forEach((m) => {
        if (m.mode === mode) m.level = "full";
        });
    }
    await user.save();

    res.json({
        user,
        success: `moved to osu!${mode == 'osu' ? '' : mode } BN`,
    });
});

/* POST remove user from full or probation BN */
router.post("/removeFromBn/:mode", async (req, res) => {
    const user = await User.findOne({ osuId: config.admin.pishifat });
    const mode = req.params.mode;
    user.isTrialNat = false;
    if (user.modes.includes(mode)) {
        const i = user.modes.findIndex((g) => g === mode);
        user.modes.splice(i, 1);
    }
    if (user.fullModes.includes(mode)) {
        const i = user.fullModes.findIndex((g) => g === mode);
        user.fullModes.splice(i, 1);
    }
    if (user.probationModes.includes(mode)) {
        const i = user.probationModes.findIndex((g) => g === mode);
        user.probationModes.splice(i, 1);
    }

    const found = user.modesInfo.find((m) => m.mode === mode);
    if (found) {
        const i = user.modesInfo.findIndex((m) => m.mode === mode);
        user.modesInfo.splice(i, 1);
    }

    await user.save();

    res.json({
        user,
        success: `removed from osu!${mode == 'osu' ? '' : mode } probation/full BN`,
    });
        
});

/* POST move user to probation BN */
router.post("/moveToProbation/:mode", async (req, res) => {
    const user = await User.findOne({ osuId: config.admin.pishifat });
    const mode = req.params.mode;
    user.isTrialNat = false;
    if (!user.groups.includes("bn")) user.groups.push("bn");
    const i = user.groups.findIndex((g) => g === "nat");
    if (i !== -1) user.groups.splice(i, 1);
    if (!user.modes.includes(mode)) user.modes.push(mode);
    if (!user.probationModes.includes(mode)) user.modes.push(mode);
    if (user.fullModes.includes(mode)) {
        const i = user.fullModes.findIndex((g) => g === mode);
        user.fullModes.splice(i, 1);
    }
    const found = user.modesInfo.find((m) => m.mode === mode);
    if (!found) user.modesInfo.push({ mode: mode, level: "probation" });
    else {
        user.modesInfo.forEach((m) => {
        if (m.mode === mode) m.level = "probation";
        });
    }
    await user.save();

    res.json({
        user,
        success: `moved to osu!${mode == 'osu' ? '' : mode } probation BN`,
    });
});

module.exports = router;
