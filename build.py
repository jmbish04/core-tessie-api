import subprocess

def build():
    # Apply migrations to local D1 database
    subprocess.run(["npx", "wrangler", "d1", "migrations", "apply"])

    # Build your Worker
    subprocess.run(["npx", "wrangler", "build"])

if __name__ == "__main__":
    build()
