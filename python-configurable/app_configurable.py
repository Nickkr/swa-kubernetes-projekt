from concurrent.futures import process
import sys
import time
from multiprocessing import Process


def endless_loop(cpu_load, frequency):
    sleep_duration = frequency * (1 - cpu_load)
    lastTime = time.perf_counter()

    counter = 0

    while True:
        counter = counter + 1
        if time.perf_counter() - lastTime >= frequency:
            #print(lastTime-time.perf_counter(), " sleeping...")
            time.sleep(sleep_duration)
            #print(lastTime-time.perf_counter(), " ended sleeping...")
            lastTime = time.perf_counter()

        # You can comment in the print statements for debugging purposes
        # In production, it will pollute your memory

# Source:https://www.geeksforgeeks.org/python-program-for-sieve-of-eratosthenes/
def sieve_of_eratosthenes(n):
    prime = [True for i in range(n + 1)]
    p = 2
    while (p * p <= n):
          
        # If prime[p] is not changed, then it is a prime
        if (prime[p] == True):
              
            # Update all multiples of p
            for i in range(p * 2, n + 1, p):
                prime[i] = False
        p += 1
    prime[0]= False
    prime[1]= False

cpu_load = float(sys.argv[1]) #e.g 0.8 (%)
frequency = float(sys.argv[2]) #e.g 2 seconds
cores = int(sys.argv[3])

processes = list()
for index in range(cores):
    x = Process(target=endless_loop, args=(cpu_load, frequency,))
    #x = Process(target=SieveOfEratosthenes, args=( 1000000000,))
    processes.append(x)
    x.start()

# Wait for threads to end
for index in range(cores):
    processes[index].join()




