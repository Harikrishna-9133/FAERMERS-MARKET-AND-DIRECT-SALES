Backend run instructions
------------------------

1) Open PowerShell or Command Prompt as your normal user.

2) Change to the backend folder:

```powershell
cd "c:\Users\manid\OneDrive\Desktop\CSP KOTTADHI\farmer-direct sales\backend"
```

3) (Optional) Verify Node and npm:

```powershell
node -v
npm -v
```

4) Start the helper script (Windows Command Prompt):

```cmd
start-server.bat
```

or run directly:

```powershell
npm install
npm run dev
```

5) If the server starts successfully you will see:

```
MongoDB Connected
Server running on port 5000
```

6) If you get errors, copy & paste the full console output and share it.

Docker (alternative)
--------------------

If you have Docker Desktop installed you can start MongoDB + the backend with one command from the workspace root:

```powershell
cd "c:\Users\manid\OneDrive\Desktop\CSP KOTTADHI"
docker-compose up -d --build
```

Then open:

http://localhost:5000

To view logs:

```powershell
docker-compose logs -f backend
```

To stop and remove created containers/volumes:

```powershell
docker-compose down -v
```

