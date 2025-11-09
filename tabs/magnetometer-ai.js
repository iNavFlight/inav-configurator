function accComputeYaw(changed, upside) {
    // Convert the changed pitch and roll into a yaw angle
    // When nose is lifted, the accelerometer measures which direction was "up"
    // This tells us the aircraft's yaw orientation
    
    let pitch_change = changed[0];
    let roll_change = changed[1];
    
    // Normalize angles to -180 to 180 range for atan2
    if (pitch_change > 180) pitch_change -= 360;
    if (roll_change > 180) roll_change -= 360;
    
    // Calculate yaw based on which axis changed when nose was lifted
    let yaw = Math.atan2(-pitch_change, roll_change) * (180 / Math.PI);
    
    // Adjust for upside down mounting
    if (upside === 'down') {
        yaw = (yaw + 180) % 360;
    }
    
    // Normalize to 0-360 range
    yaw = (yaw + 360) % 360;
    
    // Check for 45° mounting (25.5mm boards)
    let corner_raised = false;
    let pitch_change = Math.abs(raw_changed[0]);
    let roll_change = Math.abs(raw_changed[1]);

    if (pitch_change > 20 && pitch_change < 40 &&
        roll_change > 20 && roll_change < 40 &&
        Math.abs(pitch_change - roll_change) < 15) {  
            corner_raised = true;
    }

    if (corner_raised) {
        yaw = Math.round(yaw / 22.5) * 22.5;
    } else {
        yaw = Math.round(yaw / 45) * 45;
    }
    
    return yaw + 360 % 360;
}

function accAutoAlignCompass() {
    let heading_change = (SENSOR_DATA.kinematics[2] - this.heading_flat + 360) % 360;
    let yaw_correction_needed = 0;
    let roll_correction_needed = 0;

    var correction_needed = (450 - FC.SENSOR_DATA.kinematics[2]) % 360;

    heading_change = Math.round(heading_change / 90) * 90;
    if ( typeof modal != "undefined" ) {
        modal.close();
    }
    
    // If a 90 degree turn caused a 270 degree change, it's upside down.
    if (heading_change > 180) {
        console.log("mag upside down");
        roll_correction_needed = 180;
    }
    
    // Determine yaw correction needed
    if ( (Math.abs(this.heading_flat % 45) < 15) && Math.abs(correction_needed % 45) < 15 ) {
        yaw_correction_needed = ( Math.round(correction_needed / 45) * 45 + 360 ) % 360;
    } else {
        yaw_correction_needed = ( Math.round(correction_needed / 90) * 90 + 360 ) % 360;
    }

    console.log("heading_flat: " + this.heading_flat + ", change: " + heading_change + ", correction: " + correction_needed % 360);

    // SOLUTION: Apply the inverse of the IMU rotation change to the compass alignment
    
    // Create the NEW compass alignment (what we want in absolute terms)
    var newCompassRotation = new THREE.Euler(
        -THREE.Math.degToRad(self.mag_saved_pitch),
        THREE.Math.degToRad(-180 - yaw_correction_needed), 
        THREE.Math.degToRad(roll_correction_needed), 
        'YXZ'
    );
    var matrixCompass = (new THREE.Matrix4()).makeRotationFromEuler(newCompassRotation);

    // Create the CHANGE in IMU rotation (new - old)
    var oldBoardRotation = new THREE.Euler(
        THREE.Math.degToRad(self.boardAlignmentConfig.saved_pitch),
        THREE.Math.degToRad(-self.boardAlignmentConfig.saved_yaw),
        THREE.Math.degToRad(self.boardAlignmentConfig.saved_roll),
        'YXZ'
    );
    var newBoardRotation = new THREE.Euler(
        THREE.Math.degToRad(self.boardAlignmentConfig.pitch),
        THREE.Math.degToRad(-self.boardAlignmentConfig.yaw),
        THREE.Math.degToRad(self.boardAlignmentConfig.roll),
        'YXZ'
    );
    
    var matrixOldBoard = (new THREE.Matrix4()).makeRotationFromEuler(oldBoardRotation);
    var matrixNewBoard = (new THREE.Matrix4()).makeRotationFromEuler(newBoardRotation);
    
    // The delta rotation: how much the IMU frame changed
    var matrixBoardDelta = (new THREE.Matrix4()).copy(matrixNewBoard).multiply(
        (new THREE.Matrix4()).copy(matrixOldBoard).invert()
    );
    
    // Apply the INVERSE of the board rotation change to the compass
    // This keeps the compass pointing the same absolute direction
    matrixCompass.premultiply((new THREE.Matrix4()).copy(matrixBoardDelta).invert());
    
    // Extract the final compass alignment angles
    var finalCompassEuler = new THREE.Euler();
    finalCompassEuler.setFromRotationMatrix(matrixCompass, 'YXZ');
    
    var finalPitch = Math.round(THREE.Math.radToDeg(-finalCompassEuler.x) + 180);
    var finalYaw = Math.round(-180 - THREE.Math.radToDeg(finalCompassEuler.y));
    var finalRoll = Math.round(THREE.Math.radToDeg(finalCompassEuler.z));
    
    // Normalize to proper ranges
    finalPitch = ((finalPitch % 360) + 360) % 360;
    finalYaw = ((finalYaw % 360) + 360) % 360;
    finalRoll = ((finalRoll % 360) + 360) % 360;
    
    updatePitchAxis(finalPitch);
    updateRollAxis(finalRoll);
    updateYawAxis(finalYaw);

    $("#modal-compass-align-setting").text(
        finalRoll + ", " + finalPitch + ", " + finalYaw
    );

    modal = new jBox('Modal', {
        width: 460,
        height: 360,
        animation: false,
        closeOnClick: true,
        content: $('#modal-acc-align-done')
    }).open();
}

