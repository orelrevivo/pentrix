import json

log_path = "/home/orelre/.gemini/antigravity-ide/brain/ebf09b12-1a95-4657-b55f-52a74566b2e6/.system_generated/logs/transcript_full.jsonl"

file_content = ""

for line in open(log_path):
    try:
        data = json.loads(line)
        if data.get("type") == "PLANNER_RESPONSE" and "tool_calls" in data:
            for tc in data["tool_calls"]:
                if tc["name"] == "write_to_file" and "OwnerDashboard.tsx" in tc["args"].get("TargetFile", ""):
                    file_content = tc["args"]["CodeContent"]
                elif tc["name"] == "multi_replace_file_content" and "OwnerDashboard.tsx" in tc["args"].get("TargetFile", ""):
                    # simplistic approach: let's just print the diffs or we can't easily patch it here
                    pass
    except Exception as e:
        pass

print("LATEST FULL WRITE TO OwnerDashboard.tsx length:", len(file_content))
with open("/tmp/OwnerDashboard_base.tsx", "w") as f:
    f.write(file_content)
