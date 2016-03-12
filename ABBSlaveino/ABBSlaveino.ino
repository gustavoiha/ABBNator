#include <Servo.h>

#define PIN_SERVO 9
#define PIN_SENSOR A6

Servo myservo;

void setup(){
  pinMode(PIN_SENSOR, INPUT);
  pinMode(PIN_SERVO, OUTPUT);

  Serial.begin(115200);
  // Serial.println("Im alive!");

  myservo.attach(9);
}

char inc = 0;
void loop(){

  if(!Serial.available())
    return;

  inc = Serial.read();

  if(inc == 'A'){
    // Goes to active
    myservo.write(100);
  }else if(inc == 'I'){
    // Goes to inactive
    myservo.write(180);
  }else if(inc == 'S'){
    long sensorVal = analogRead(PIN_SENSOR);

    Serial.println(sensorVal);
  }
}
