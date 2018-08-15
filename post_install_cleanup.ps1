### this will remove the folders from %appdatalocal% for each user account on a given computer and then recreate the inav-configurator folder and place a text file in that folder. The script checks for this file and if it exsists will simply exit.
## because this checks each and every user on the windows machine ps will kick out some errors for any user that it doesnt have permission to access there local app data folder. these can be ignored.


#check for file
$txtfilepath = "C:\Users\$($_.Name)\AppData\Local\inav-configurator\check.txt"

$testpath = test-path $txtfilepath

if ($testpath -eq $true){
    $append = "Terminated at time xxxxx"
    $append | out-file $txtfilepath -append -force
    break    
}
else{
    #continue script
    # Get users
$users = Get-ChildItem -Path "C:\Users"

# Loop through users and delete the folder
$users | foreach-Object {
    Remove-Item -Recurse -Path "C:\Users\$($_.Name)\AppData\Local\inav-configurator" -Force

}
}
 #create new inav-configurator folder 
    New-Item -Path "C:\Users\$($_.Name)\AppData\Local\" -name "inav-configurator" -ItemType "directory"
 # add text file to check for 
    New-Item -Path "C:\Users\$($_.Name)\AppData\Local\inav-configurator" -name "check.txt" -ItemType "file" -Value "config cleared"
    break
  