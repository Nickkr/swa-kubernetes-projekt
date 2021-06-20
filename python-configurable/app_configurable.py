from concurrent.futures import process
import time
from multiprocessing import Process
from enum import Enum
import math
import random
from os import getenv
from datetime import datetime

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
    print(f"{datetime.now()} DEFINED LOAD STARTING Cores: {cores}; Elements: {elements};")

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
    print(f"{datetime.now()} DEFINED LOAD ENDED Cores: {cores}; Elements: {elements}; Time:{ seconds};")
    return seconds

def process_defined_time(cores, cpu_load, frequency, target_time):
    print(f"{datetime.now()} DEFINED TIME STARTING Time:{ target_time} Cores: {cores}; CPU Load: {cpu_load}; Interval: {frequency};")
    processes = list()
    for index in range(cores):
        x = Process(target=endless_loop, args=(cpu_load, frequency, target_time,))
        processes.append(x)
        x.start()

    # Wait for threads to end
    for index in range(cores):
        processes[index].join()

    print(f"{datetime.now()} DEFINED TIME ENDED Time:{ target_time} Cores: {cores}; CPU Load: {cpu_load}; Interval: {frequency};")

def main(cpu_load, frequency, cores, test_variant, target_time):
    if test_variant == TestVariant.DEFINED_TIME:
        process_defined_time(cores, cpu_load, frequency, target_time)
    elif test_variant == TestVariant.DEFINED_LOAD:
        elements = 1000000000
        process_defined_load(cores, elements)

if __name__ == '__main__':
    cpu_load = float(getenv("CPU_LOAD"))
    frequency = float(getenv("FREQUENCY"))
    cores = int(getenv("CORES"))
    test_variant = TestVariant(int(getenv("TEST_VARIANT")))
    runtime = int(getenv("RUNTIME"))

    main(cpu_load, frequency, cores, test_variant, runtime)

'''
For testing: Set environment variables

export CPU_LOAD=0.5
export FREQUENCY=10
export CORES=4
export TEST_VARIANT=0
export RUNTIME=30
'''
