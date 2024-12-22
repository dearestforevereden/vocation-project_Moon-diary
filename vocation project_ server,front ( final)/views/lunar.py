from flask import Flask, render_template, jsonify
from datetime import datetime
import requests
from flask_cors import CORS


app = Flask(__name__, template_folder='templates')
CORS(app, resources={r"/get_lunar_phase": {"origins": "http://localhost:YOUR_FRONTEND_PORT"}})

def get_lunar_phase(year, month, day):
    url = 'http://apis.data.go.kr/B090041/openapi/service/LunPhInfoService/getLunPhInfo'
    params = {
        'serviceKey': 
'NRGW4geSrSaLj5GSlr5JVNqTnfMEUxP%2BfN9g4uX344NxEE2R%2FoWBlMDGRmBD7OkI3660w4Zjm%2FWpryGZ%2FN%2F7Xw%3D%3D', # 여기서 API키와 시간 날짜 등을 선택하면 
        'solYear': year,
        'solMonth': month,
        'solDay': day
    }
    response = requests.get(url, params=params)
    return response.content

def get_current_date():
    now = datetime.now()
    year = now.year
    month = now.month
    day = now.day
    return str(year), str(month).zfill(2), str(day).zfill(2)

@app.route('/')
def index():
    return render_template('contact.html') # 여기로 다시 전

# @app.route('/get_lunar_phase')
# def get_lunar_phase_route():
    # year, month, day = get_current_date()
    # lunar_phase_info = get_lunar_phase(year, month, day)
    # return jsonify(lunar_phase_info)

@app.route('/get_lunar_phase')
def get_lunar_phase_route():
    year, month, day = get_current_date()
    lunar_phase_info = get_lunar_phase(year, month, day)
    return jsonify({"lunar_phase_info": lunar_phase_info.decode('utf-8')})


if __name__ == '__main__':
    app.run(debug=True, port=3000)
