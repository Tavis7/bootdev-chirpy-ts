import express from "express";
import { Request, Response } from "express";

const app = express();
const PORT = 8080;

app.use("/app", express.static("./src/app"));
app.get("/healthz", handlerReadiness);

async function handlerReadiness(req: Request, res: Response): Promise<void> {
    res.set("Content-Type", "text/plain");
    res.send("OK");
}

app.listen(PORT, () => {
    console.log(`Server is running at htt://localhost:${PORT}`);
});
