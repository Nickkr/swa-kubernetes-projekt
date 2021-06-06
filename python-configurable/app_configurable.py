from concurrent.futures import process
import sys
import time
from multiprocessing import Process
from enum import Enum
import math
#import numpy as np
#from numpy import core
import random

class TestVariant(Enum):
    DEFINED_TIME = 0
    DEFINED_LOAD = 1
    
    
def endless_loop(cpu_load, frequency, target_time):
    sleep_duration = frequency * (1 - cpu_load)
    lastTime = time.perf_counter()
    startTime = lastTime

    counter = 0

    while time.perf_counter() - startTime < target_time:
        counter = counter + 1
        if time.perf_counter() - lastTime >= frequency:
            #print(lastTime-time.perf_counter(), " sleeping...")
            time.sleep(sleep_duration)
            #print(lastTime-time.perf_counter(), " ended sleeping...")
            lastTime = time.perf_counter()

        # You can comment in the print statements for debugging purposes
        # In production, it will pollute your memory

def sqrt_sum(count):
    y = 0
    for i in range(count):
        el = random.random()
        y += math.sqrt(el)
    return y

def process_defined_load(cores, elements):
    start = time.time()
    processes = list()

    arr = [(int)(elements/cores) for i in range(cores)]

    # MULTIPROCESSING ALTERNATIVE 1
    # with Pool(processes=cores) as p:
    #     print(p.map(sqrt_sum, arr))
    # ENDALTERNATIVE

    # MULTIPROCESSING ALTERNATIVE 2 
    processes = list()
    for index in range(cores):
        x = Process(target=sqrt_sum, args=(arr[index],))
        processes.append(x)
        x.start()

    # Wait for threads to end
    for index in range(cores):
        processes[index].join()
    # ENDALTERNATIVE

    seconds = time.time() - start    
    print(f"Cores: {cores}; Elements: {elements}; Time:{ seconds}")
    return seconds

def process_defined_time(cores, cpu_load, frequency, target_time):
    processes = list()
    for index in range(cores):
        x = Process(target=endless_loop, args=(cpu_load, frequency, target_time,))
        processes.append(x)
        x.start()

    # Wait for threads to end
    for index in range(cores):
        processes[index].join()

def main(cpu_load, frequency, cores, test_variant, target_time):
    if test_variant == TestVariant.DEFINED_TIME:
        process_defined_time(cores, cpu_load, frequency, target_time)
    elif test_variant == TestVariant.DEFINED_LOAD:
        elements = 1000000000
        process_defined_load(cores, elements)

if __name__ == '__main__':
    main(float(sys.argv[1]), float(sys.argv[2]), int(sys.argv[3]), TestVariant(int(sys.argv[4])), int(sys.argv[5]))



