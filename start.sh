#!/bin/bash

# Tạo cgroup cho tiến trình 'npm run schedule'
# cgcreate -g memory,cpu:/kaizen-schedule

# # Giới hạn CPU cho schedule (1 core trên tổng 4 cores)
# echo 25000 | tee /sys/fs/cgroup/cpu/kaizen-schedule/cpu.cfs_quota_us
# echo 100000 | tee /sys/fs/cgroup/cpu/kaizen-schedule/cpu.cfs_period_us

# # Giới hạn RAM cho schedule (512MB)
# echo $((512 * 1024 * 1024)) | tee /sys/fs/cgroup/memory/kaizen-schedule/memory.limit_in_bytes

# # Chạy tiến trình 'npm run schedule' trong cgroup đã tạo
# cgexec -g memory,cpu:kaizen-schedule npm run schedule &

# # Tạo cgroup cho tiến trình 'npm run start'
# cgcreate -g memory,cpu:/kaizen-start

# # Giới hạn CPU cho start (2 cores trên tổng 4 cores)
# echo 50000 | tee /sys/fs/cgroup/cpu/kaizen-start/cpu.cfs_quota_us
# echo 100000 | tee /sys/fs/cgroup/cpu/kaizen-start/cpu.cfs_period_us

# # Giới hạn RAM cho start (1GB)
# echo $((1024 * 1024 * 1024)) | tee /sys/fs/cgroup/memory/kaizen-start/memory.limit_in_bytes

# # Chạy tiến trình 'npm run start' trong cgroup đã tạo
# cgexec -g memory,cpu:kaizen-start npm run start

npm run start 
# &
# npm run schedule