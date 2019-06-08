function Gear(name, speed) {
    var self = this;
    self.name = name;
    self.speed = speed;

    self.getPercentDiff = function (targetRPM) {
        return Math.round(((targetRPM-self.speed)/targetRPM) * -100);
    }
}

var ToolMaterials = {
    HighSpeedSteel: "High Speed Steel",
    Carbide: "Carbide"
};

var WorkMaterials = {
    PlainCarbonSteel: "Plain Carbon Steel",
    Aluminum: "Aluminum"
}

var DoNotKnow = "LOL, IDK?";

var sfmLookup = {
    [WorkMaterials.PlainCarbonSteel]: {
        [ToolMaterials.HighSpeedSteel]: new Map([
            ["100 to 125", 140],
            ["125 to 175", 120],
            ["175 to 225", 100],
            ["225 to 275", 70],
            [DoNotKnow, NaN]

        ]),
        [ToolMaterials.Carbide]: new Map([
            ["100 to 125", 500],
            ["125 to 175", 400],
            ["175 to 225", 350],
            ["225 to 275", 300],
            [DoNotKnow, NaN]

        ]),
    },
    [WorkMaterials.Aluminum]: {
        [ToolMaterials.HighSpeedSteel]: new Map([
            ["Any", 400],
            [DoNotKnow, NaN]
        ]),
        [ToolMaterials.Carbide]: new Map([
            ["Any", 1200],
            [DoNotKnow, NaN]
        ]),
    }
};

var gears = new Map([
    [120, "BC1"],
    [300, "BC2"],
    [400, "AC1"],
    [600, "BC3"],
    [1000, "AC2"],
    [2000, "AC3"]
]);


var app = new Vue({
    el: 'main',
    data: {
        diameter: 0,
        toolMaterials: [ToolMaterials.HighSpeedSteel, ToolMaterials.Carbide],
        workMaterials: [WorkMaterials.PlainCarbonSteel, WorkMaterials.Aluminum],
        toolMaterial: "",
        workMaterial: "",
        workHardness: "",
        manualSFM: 0,
    },
    computed: {
        workHardnesses: function () {
            var keys = [];
            if (this.toolMaterial && this.workMaterial) {
                var keyIter = sfmLookup[this.workMaterial][this.toolMaterial].keys();
                for (key of keyIter) {
                    keys.push(key);
                }
            }
            return keys;
        },

        surfaceFeetMin: function () {
            if (this.toolMaterial && this.workMaterial && this.workHardness) {
                return sfmLookup[this.workMaterial][this.toolMaterial].get(this.workHardness);
            }
            return 0;
        },

        rpm: function () {
            var sfm = this.manualSFM;
            if (this.surfaceFeetMin) {
                sfm = this.surfaceFeetMin;
            }
            return (sfm * 12) / (Math.PI * this.diameter);
        },
        latheGears: function () {
            if (gears.has(this.rpm)) {
                return gears.get(this.rpm);
            }

            var lowSpeed = null;
            var highSpeed = null;
            for (const speed of gears.keys()) {
                if (speed < this.rpm) {
                    lowSpeed = speed;
                } else {
                    highSpeed = speed;
                    break;
                }
            }
            var suggestedGears = [];
            if (lowSpeed) {
                suggestedGears.push(new Gear(gears.get(lowSpeed), lowSpeed));
            }
            if (highSpeed) {
                suggestedGears.push(new Gear(gears.get(highSpeed), highSpeed));
            }

            return suggestedGears
        },
        unknownHardness: function () {
            return this.workHardness === DoNotKnow;
        },
        validSpeeds: function () {
            var speeds = [];
            if (this.toolMaterial && this.workMaterial) {
                var valIter = sfmLookup[this.workMaterial][this.toolMaterial].values();
                for (val of valIter) {
                    if (isFinite(val)) {
                        speeds.push(val);
                    }
                }
            }
            return speeds.reverse();
        },
        showResults: function () {
            return isFinite(this.rpm) && this.rpm > 0;
        }
    }
});
