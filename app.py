import os
import subprocess

if __name__ == "__main__":
    rootDir = os.getcwd()  # Get the current working directory
    
    # Path to the 'cruise-control-node' folder
    cruise_node_dir = os.path.join(rootDir, "cruise-control-node")

    # Run Gradle build
    subprocess.run(["./gradlew", "build"], check=True)

    # Ensure the cruise_node_dir exists
    if os.path.isdir(cruise_node_dir):
        # Change to the cruise_node_dir directory
        os.chdir(cruise_node_dir)

        # Install dependencies
        subprocess.run(["npm", "install", "--force"], check=True)

        # Run the React app server (assuming this is what you want to do)
        subprocess.run(["node", "server.js"], check=True)
        
        # Change back to the original root directory
        os.chdir(rootDir)

        # Run Kafka Cruise Control start script in the background using subprocess.Popen
        subprocess.Popen(["nohup", "sh", "kafka-cruise-control-start.sh", "config/cruisecontrol.properties", "&"])

    else:
        print(f"Error: The directory '{cruise_node_dir}' does not exist.")
