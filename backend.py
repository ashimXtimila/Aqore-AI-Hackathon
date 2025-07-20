from http.server import SimpleHTTPRequestHandler, HTTPServer
import json
import urllib.parse
import os

JOBS_FILE = "jobs.json"

class MyHandler(SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def _send_json(self, data, code=200):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        if parsed_path.path == "/jobs":
            if not os.path.exists(JOBS_FILE):
                with open(JOBS_FILE, "w") as f:
                    json.dump([], f)

            with open(JOBS_FILE, "r") as f:
                jobs = json.load(f)
            self._send_json(jobs)
        else:
            self._send_json({"error": "Route not found"}, 404)

    def do_POST(self):
        parsed_path = urllib.parse.urlparse(self.path)
        if parsed_path.path == "/add_job":
            length = int(self.headers["Content-Length"])
            data = json.loads(self.rfile.read(length))

            required_fields = ["title", "skills", "description", "years_experience"]
            if not all(field in data for field in required_fields):
                self._send_json({"error": "Missing job fields"}, 400)
                return

            if not os.path.exists(JOBS_FILE):
                with open(JOBS_FILE, "w") as f:
                    json.dump([], f)

            with open(JOBS_FILE, "r") as f:
                jobs = json.load(f)

            new_job = {
                "id": max([j["id"] for j in jobs], default=0) + 1,
                "title": data["title"],
                "skills": data["skills"],
                "description": data["description"],
                "years_experience": int(data["years_experience"])
            }
            jobs.append(new_job)

            with open(JOBS_FILE, "w") as f:
                json.dump(jobs, f, indent=2)

            self._send_json(new_job)
        else:
            self._send_json({"error": "Route not found"}, 404)

    def do_PUT(self):
        parsed_path = urllib.parse.urlparse(self.path)
        if parsed_path.path == "/update_job":
            params = urllib.parse.parse_qs(parsed_path.query)
            if "id" not in params:
                self._send_json({"error": "Missing job id"}, 400)
                return
            job_id = int(params["id"][0])

            length = int(self.headers["Content-Length"])
            data = json.loads(self.rfile.read(length))

            required_fields = ["title", "skills", "description", "years_experience"]
            if not all(field in data for field in required_fields):
                self._send_json({"error": "Missing job fields"}, 400)
                return

            if not os.path.exists(JOBS_FILE):
                self._send_json({"error": "Jobs file not found"}, 500)
                return

            with open(JOBS_FILE, "r") as f:
                jobs = json.load(f)

            updated = False
            for job in jobs:
                if job["id"] == job_id:
                    job["title"] = data["title"]
                    job["skills"] = data["skills"]
                    job["description"] = data["description"]
                    job["years_experience"] = int(data["years_experience"])
                    updated = True
                    break

            if not updated:
                self._send_json({"error": "Job not found"}, 404)
                return

            with open(JOBS_FILE, "w") as f:
                json.dump(jobs, f, indent=2)

            self._send_json({"message": "Job updated"})
        else:
            self._send_json({"error": "Route not found"}, 404)

    def do_DELETE(self):
        parsed_path = urllib.parse.urlparse(self.path)
        if parsed_path.path == "/delete_job":
            params = urllib.parse.parse_qs(parsed_path.query)
            if "id" not in params:
                self._send_json({"error": "Missing job id"}, 400)
                return
            job_id = int(params["id"][0])

            if not os.path.exists(JOBS_FILE):
                self._send_json({"error": "Jobs file not found"}, 500)
                return

            with open(JOBS_FILE, "r") as f:
                jobs = json.load(f)

            jobs = [job for job in jobs if job["id"] != job_id]

            with open(JOBS_FILE, "w") as f:
                json.dump(jobs, f, indent=2)

            self._send_json({"message": "Job deleted"})
        else:
            self._send_json({"error": "Route not found"}, 404)

if __name__ == "__main__":
    server = HTTPServer(("localhost", 8000), MyHandler)
    print("Server running at http://localhost:8000")
    server.serve_forever()
