
import fs from "fs";
let f = fs.readFileSync("src/components/apb/EditRoundDialog.tsx", "utf8");

f = f.replace(`const [formData, setFormData] = useState({
    title: round.title || "",
    description: round.description || "",
    durationSeconds: round.durationSeconds || 1200,
    challengeType: round.challengeType || "TEXT",
    challengeInstructions: round.challengeInstructions || "",
    referenceMaterial: round.referenceMaterial || "",
    imageUrl: round.imageUrl || "",
    constraintsStr: round.constraints?.join("\\n") || "",
  });
      setError("");
    }
  }, [round]);`, `const [formData, setFormData] = useState({
    title: round?.title || "",
    description: round?.description || "",
    durationSeconds: round?.durationSeconds || 1200,
    challengeType: round?.challengeType || "TEXT",
    challengeInstructions: round?.challengeInstructions || "",
    referenceMaterial: round?.referenceMaterial || "",
    imageUrl: round?.imageUrl || "",
    constraintsStr: round?.constraints?.join("\\n") || "",
  });

  useEffect(() => {
    if (round) {
      setFormData({
        title: round.title || "",
        description: round.description || "",
        durationSeconds: round.durationSeconds || 1200,
        challengeType: round.challengeType || "TEXT",
        challengeInstructions: round.challengeInstructions || "",
        referenceMaterial: round.referenceMaterial || "",
        imageUrl: round.imageUrl || "",
        constraintsStr: round.constraints?.join("\\n") || "",
      });
      setError("");
    }
  }, [round]);`);
  
fs.writeFileSync("src/components/apb/EditRoundDialog.tsx", f);
console.log("Fixed EditRoundDialog useEffect");

