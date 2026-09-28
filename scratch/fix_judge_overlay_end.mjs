
import fs from "fs";

let f = fs.readFileSync("src/app/judge/page.tsx", "utf8");
f = f.replace(`      )}
    </div>
  );
}`, `      )}
      </div>
    </ParticipantScreenOverlay>
  );
}`);
fs.writeFileSync("src/app/judge/page.tsx", f);

let f2 = fs.readFileSync("src/app/judge/submissions/[submissionId]/page.tsx", "utf8");
f2 = f2.replace(`        </APBCard>
      </form>
    </div>
  );
}`, `        </APBCard>
      </form>
      </div>
    </ParticipantScreenOverlay>
  );
}`);
fs.writeFileSync("src/app/judge/submissions/[submissionId]/page.tsx", f2);
console.log("Fixed Judge Overlays");

