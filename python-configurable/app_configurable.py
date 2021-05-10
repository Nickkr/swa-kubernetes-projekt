import sys
import time

counter = 0

cpu_load = float(sys.argv[1]) #e.g 0.8 (%)
frequency = float(sys.argv[2]) #e.g 2 seconds
#--> in this case the while-loop should sleep for 0.4s each 2 seconds
sleep_duration = frequency * (1 - cpu_load)
lastTime = time.perf_counter()

while True:
    counter = counter + 1
    if time.perf_counter() - lastTime >= frequency:
        #print(lastTime-time.perf_counter(), " sleeping...")
        time.sleep(sleep_duration)
        #print(lastTime-time.perf_counter(), " ended sleeping...")
        lastTime = time.perf_counter()

# You can comment in the print statements for debugging purposes
# In production, it will pollute your memory