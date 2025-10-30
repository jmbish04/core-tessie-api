import subprocess

def deploy():
    # Apply migrations to remote D1 database
    subprocess.run(["npx", "wrangler", "d1", "migrations", "apply", "DB", "--remote"])

    # Deploy your Worker
    subprocess.run(["npx", "wrangler", "deploy"])

if __name__ == "__main__":
    deploy()
