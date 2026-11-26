"""Cut the two V3 continuations and measure both speaker tracks from the credited AAC."""
import hashlib
import json
from pathlib import Path
import struct
import subprocess
import sys
import wave

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "app/v3/listening-examples.json"


def peaks(channel, scale):
    size = len(channel)
    bins = 160
    return [
        round(100 * max(map(abs, channel[i * size // bins:(i + 1) * size // bins])) / scale)
        for i in range(bins)
    ]


def main(source):
    study = json.loads(MANIFEST.read_text())
    if hashlib.sha256(source.read_bytes()).hexdigest() != study["source"]["sha256"]:
        raise ValueError("Supply the credited recording with the SHA-256 in listening-examples.json")
    rate = study["sampleRate"]
    channels = [
        subprocess.check_output([
            "ffmpeg", "-v", "error", "-nostdin", "-i", str(source), "-af",
            f"pan=mono|c0=c{channel},aresample={rate}", "-c:a", "pcm_s16le", "-f", "s16le", "-",
        ]) for channel in (0, 1)
    ]
    for example in study["examples"]:
        start = example["startMs"] * rate // 1000
        decision = (example["pauseStartMs"] + study["pauseMs"]) * rate // 1000
        end = decision + study["continuationMs"] * rate // 1000
        left, right = [struct.unpack(f"<{end - start}h", ch[start * 2:end * 2]) for ch in channels]
        lead_frames = decision - start
        lead_path = ROOT / "public" / example["src"].lstrip("/")
        with wave.open(str(lead_path), "rb") as lead:
            if lead.readframes(lead.getnframes()) != struct.pack(f"<{lead_frames}h", *left[:lead_frames]):
                raise ValueError(f"{lead_path.name} does not match the recording up to the decision")

        # Both voices play in the center. Integer packing also checks that their sum fits 16-bit PCM.
        mono = [a + b for a, b in zip(left[lead_frames:], right[lead_frames:])]
        path = lead_path.with_name(lead_path.stem + "-next.wav")
        with wave.open(str(path), "wb") as audio:
            audio.setparams((1, 2, rate, 0, "NONE", "not compressed"))
            audio.writeframes(struct.pack(f"<{len(mono)}h", *mono))
        scale = max(max(map(abs, left)), max(map(abs, right)))
        example["continuation"] = {
            "src": "/" + path.relative_to(ROOT / "public").as_posix(),
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            "speaker1Peaks": peaks(left, scale),
            "speaker2Peaks": peaks(right, scale),
        }
    MANIFEST.write_text(json.dumps(study, indent=2, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    main(Path(sys.argv[1]))
