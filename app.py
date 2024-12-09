import os
import subprocess

if __name__ == "__main__":
	rootDir = os.getcwd();
    # Change the directory to the folder where your app is located
    cruise_node_dir = os.path.join(os.getcwd(), "cruise-control-node")  # Path to the 'cruise_node_dir' folder

    # Ensure the React app folder exists
	subprocess.run(["./gradlew", "build"], check=True)
    if os.path.isdir(cruise_node_dir):

        # Change to the cruise_node_dir directory

        os.chdir(cruise_node_dir)

        # Install dependencies (npm install)

        subprocess.run(["npm", "install", "--force"], check=True)

        # Run npm start to start the React development server

        subprocess.run(["node", "server.js"], check=True)
		
		os.chdir(rootDir);
		subprocess.Popen(["nohup", "sh", "kafka-cruise-control-start.sh", "config/cruisecontrol.properties", "&"], check=True)

    else:

        print(f"Error: The directory '{cruise_node_dir}' does not exist.")
 