import { useState } from 'react';
import './CodeTemplates.css';

const templates = {
  javascript: {
    'Array Operations': `// Array common operations
const arr = [1, 2, 3, 4, 5];

// Map
const doubled = arr.map(x => x * 2);

// Filter
const evens = arr.filter(x => x % 2 === 0);

// Reduce
const sum = arr.reduce((acc, x) => acc + x, 0);

// Find
const found = arr.find(x => x > 3);

console.log({ doubled, evens, sum, found });`,

    'Binary Search': `function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    
    if (arr[mid] === target) {
      return mid;
    } else if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  return -1;
}

// Test
const arr = [1, 3, 5, 7, 9, 11, 13];
console.log(binarySearch(arr, 7)); // 3`,

    'Two Pointers': `function twoSum(nums, target) {
  const map = new Map();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    
    map.set(nums[i], i);
  }
  
  return [];
}

console.log(twoSum([2, 7, 11, 15], 9)); // [0, 1]`,

    'Async/Await': `async function fetchData(url) {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

// Usage
fetchData('https://api.example.com/data')
  .then(data => console.log(data))
  .catch(err => console.error(err));`
  },

  python: {
    'List Comprehension': `# List comprehension examples
numbers = [1, 2, 3, 4, 5]

# Basic comprehension
squares = [x**2 for x in numbers]

# With condition
evens = [x for x in numbers if x % 2 == 0]

# Nested comprehension
matrix = [[i*j for j in range(3)] for i in range(3)]

print(f"Squares: {squares}")
print(f"Evens: {evens}")
print(f"Matrix: {matrix}")`,

    'Binary Search': `def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1

# Test
arr = [1, 3, 5, 7, 9, 11, 13]
print(binary_search(arr, 7))  # 3`,

    'Dictionary Operations': `# Dictionary common operations
person = {'name': 'Alice', 'age': 30, 'city': 'NYC'}

# Get with default
country = person.get('country', 'USA')

# Update
person.update({'age': 31, 'job': 'Engineer'})

# Dictionary comprehension
squares = {x: x**2 for x in range(5)}

# Merge dictionaries (Python 3.9+)
defaults = {'theme': 'dark', 'lang': 'en'}
settings = {**defaults, **person}

print(settings)`,

    'Class Template': `class Stack:
    def __init__(self):
        self.items = []
    
    def push(self, item):
        self.items.append(item)
    
    def pop(self):
        if not self.is_empty():
            return self.items.pop()
        return None
    
    def peek(self):
        if not self.is_empty():
            return self.items[-1]
        return None
    
    def is_empty(self):
        return len(self.items) == 0
    
    def size(self):
        return len(self.items)

# Usage
stack = Stack()
stack.push(1)
stack.push(2)
print(stack.pop())  # 2`
  },

  java: {
    'Class Template': `public class Solution {
    public static void main(String[] args) {
        Solution sol = new Solution();
        int result = sol.solve();
        System.out.println(result);
    }
    
    public int solve() {
        // Your code here
        return 0;
    }
}`,

    'ArrayList Operations': `import java.util.*;

public class ArrayListExample {
    public static void main(String[] args) {
        List<Integer> list = new ArrayList<>();
        
        // Add elements
        list.add(1);
        list.add(2);
        list.add(3);
        
        // Iterate
        for (int num : list) {
            System.out.println(num);
        }
        
        // Stream operations
        list.stream()
            .filter(x -> x % 2 == 0)
            .map(x -> x * 2)
            .forEach(System.out::println);
    }
}`
  },

  cpp: {
    'Vector Operations': `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    vector<int> vec = {1, 2, 3, 4, 5};
    
    // Sort
    sort(vec.begin(), vec.end());
    
    // Find
    auto it = find(vec.begin(), vec.end(), 3);
    
    // Transform
    transform(vec.begin(), vec.end(), vec.begin(), 
              [](int x) { return x * 2; });
    
    // Print
    for (int num : vec) {
        cout << num << " ";
    }
    
    return 0;
}`,

    'Binary Search': `#include <iostream>
#include <vector>

using namespace std;

int binarySearch(vector<int>& arr, int target) {
    int left = 0, right = arr.size() - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    
    return -1;
}

int main() {
    vector<int> arr = {1, 3, 5, 7, 9};
    cout << binarySearch(arr, 7) << endl;
    return 0;
}`
  }
};

export default function CodeTemplates({ language, onInsert }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const languageTemplates = templates[language] || {};
  const templateNames = Object.keys(languageTemplates);

  const handleInsert = () => {
    if (selectedTemplate && languageTemplates[selectedTemplate]) {
      onInsert(languageTemplates[selectedTemplate]);
      setIsOpen(false);
      setSelectedTemplate('');
    }
  };

  if (templateNames.length === 0) {
    return null;
  }

  return (
    <div className="code-templates">
      <button 
        className="templates-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Code Templates"
      >
        📋 Templates
      </button>

      {isOpen && (
        <div className="templates-modal">
          <div className="templates-content">
            <div className="templates-header">
              <h3>Code Templates - {language}</h3>
              <button 
                className="close-btn"
                onClick={() => setIsOpen(false)}
              >
                ✖️
              </button>
            </div>

            <div className="templates-list">
              {templateNames.map(name => (
                <div
                  key={name}
                  className={`template-item ${selectedTemplate === name ? 'selected' : ''}`}
                  onClick={() => setSelectedTemplate(name)}
                >
                  {name}
                </div>
              ))}
            </div>

            {selectedTemplate && (
              <div className="template-preview">
                <h4>{selectedTemplate}</h4>
                <pre>{languageTemplates[selectedTemplate]}</pre>
              </div>
            )}

            <div className="templates-actions">
              <button
                className="insert-btn"
                onClick={handleInsert}
                disabled={!selectedTemplate}
              >
                Insert Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
